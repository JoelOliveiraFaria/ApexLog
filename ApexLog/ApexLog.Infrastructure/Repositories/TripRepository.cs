using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore; 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Infrastructure.Repositories
{
    public class TripRepository : ITripRepository
    {
        private readonly ApexLogDbContext _context;

        public TripRepository(ApexLogDbContext context)
        {
            _context = context;
        }

        public async Task SaveAsync(Trip trip)
        {
            await _context.Trips.AddAsync(trip);
            await _context.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<Trip>> GetAllAsync()
        {
            return await _context.Trips
                .Include(t => t.Motorcycle)
                .OrderByDescending(t => t.StartTime)
                .ToListAsync();
        }

        public async Task<Trip?> GetByIdAsync(Guid id)
        {
            return await _context.Trips
                .Include(t => t.Motorcycle)
                .Include(t => t.TelemetryPoints)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Trips.AnyAsync(t => t.Id == id);
        }

        /// <summary>
        /// Insere um lote de pontos de telemetria diretamente, sem carregar o agregado Trip completo
        /// para memória, para suportar o streaming de alta frequência vindo do mobile.
        /// </summary>
        public async Task AddTelemetryBatchAsync(Guid tripId, IEnumerable<TelemetryPoint> points)
        {
            if (!await ExistsAsync(tripId))
            {
                throw new KeyNotFoundException($"Viagem '{tripId}' não encontrada.");
            }

            var previousAutoDetect = _context.ChangeTracker.AutoDetectChangesEnabled;
            _context.ChangeTracker.AutoDetectChangesEnabled = false;

            try
            {
                foreach (var point in points)
                {
                    _context.TelemetryPoints.Add(point);
                    _context.Entry(point).Property("TripId").CurrentValue = tripId;
                }

                await _context.SaveChangesAsync();
            }
            finally
            {
                _context.ChangeTracker.AutoDetectChangesEnabled = previousAutoDetect;
            }
        }

        /// <summary>
        /// Calcula os agregados (Max/Avg) via SQL, sem carregar todos os pontos de telemetria para
        /// memória, e fecha a viagem com esses valores. Quando não é fornecida uma distância explícita,
        /// é calculada por integração trapezoidal da velocidade do veículo ao longo do tempo — o mesmo
        /// princípio de um conta-quilómetros, usando o sensor de velocidade da própria mota via OBD2.
        /// </summary>
        public async Task FinishTripAsync(Guid tripId, DateTime endTime, double? distanceKm)
        {
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == tripId);
            if (trip == null)
            {
                throw new KeyNotFoundException($"Viagem '{tripId}' não encontrada.");
            }

            var pointsQuery = _context.TelemetryPoints.Where(p => EF.Property<Guid>(p, "TripId") == tripId);

            int maxSpeed = 0;
            double avgSpeed = 0;
            int maxRpm = 0;
            double resolvedDistanceKm = distanceKm ?? 0;

            if (await pointsQuery.AnyAsync())
            {
                maxSpeed = await pointsQuery.MaxAsync(p => p.SpeedKmh);
                avgSpeed = Math.Round(await pointsQuery.AverageAsync(p => p.SpeedKmh), 1);
                maxRpm = await pointsQuery.MaxAsync(p => p.Rpm);

                if (distanceKm == null)
                {
                    var orderedSamples = await pointsQuery
                        .OrderBy(p => p.Timestamp)
                        .Select(p => new { p.Timestamp, p.SpeedKmh })
                        .ToListAsync();

                    double distanceAccumulatorKm = 0;
                    for (var i = 1; i < orderedSamples.Count; i++)
                    {
                        var elapsedHours = (orderedSamples[i].Timestamp - orderedSamples[i - 1].Timestamp).TotalHours;
                        if (elapsedHours <= 0) continue;

                        var avgSegmentSpeedKmh = (orderedSamples[i].SpeedKmh + orderedSamples[i - 1].SpeedKmh) / 2.0;
                        distanceAccumulatorKm += avgSegmentSpeedKmh * elapsedHours;
                    }

                    resolvedDistanceKm = Math.Round(distanceAccumulatorKm, 2);
                }
            }

            trip.CompleteWithAggregates(endTime, resolvedDistanceKm, maxSpeed, avgSpeed, maxRpm);
            await _context.SaveChangesAsync();
        }
    }
}
