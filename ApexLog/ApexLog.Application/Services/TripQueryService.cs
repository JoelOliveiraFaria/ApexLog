using ApexLog.Application.DTOs;
using ApexLog.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Application.Services
{
    public class TripQueryService
    {
        private readonly ITripRepository _tripRepository;

        public TripQueryService(ITripRepository tripRepository)
        {
            _tripRepository = tripRepository;
        }

        public async Task<IReadOnlyList<TripSummaryDto>> GetAllTripsAsync(Guid userId)
        {
            var trips = await _tripRepository.GetAllByUserIdAsync(userId);

            return trips.Select(t => new TripSummaryDto
            {
                Id = t.Id,
                Motorcycle = MapMotorcycle(t),
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                DistanceKm = t.DistanceKm,
                MaxSpeedKmh = t.MaxSpeedKmh,
                AvgSpeedKmh = t.AvgSpeedKmh,
                MaxRpm = t.MaxRpm
            }).ToList();
        }

        public async Task<TripDetailDto?> GetTripByIdAsync(Guid userId, Guid id)
        {
            var trip = await _tripRepository.GetByIdAsync(id);

            // 404 tanto para "não existe" como para "pertence a outro utilizador" — não revela
            // a outros utilizadores autenticados que um determinado Id de viagem sequer existe.
            if (trip == null || trip.Motorcycle?.UserId != userId) return null;

            return new TripDetailDto
            {
                Id = trip.Id,
                Motorcycle = MapMotorcycle(trip),
                StartTime = trip.StartTime,
                EndTime = trip.EndTime,
                DistanceKm = trip.DistanceKm,
                MaxSpeedKmh = trip.MaxSpeedKmh,
                AvgSpeedKmh = trip.AvgSpeedKmh,
                MaxRpm = trip.MaxRpm,
                TelemetryPoints = trip.TelemetryPoints.Select(p => new TelemetryPointResponseDto
                {
                    Timestamp = p.Timestamp,
                    Rpm = p.Rpm,
                    SpeedKmh = p.SpeedKmh,
                    ThrottlePosition = p.ThrottlePosition,
                    EngineTempC = p.EngineTempC,
                }).ToList()
            };
        }

        // A viagem exige sempre uma mota associada (FK obrigatória), por isso a navegação só vem
        // nula se o repositório se esquecer do Include — assinalar isso alto e cedo em vez de um NRE.
        private static MotorcycleDto MapMotorcycle(Domain.Entities.Trip trip)
        {
            var motorcycle = trip.Motorcycle
                ?? throw new InvalidOperationException($"A mota da viagem '{trip.Id}' não foi carregada (falta Include).");

            return new MotorcycleDto(motorcycle.Id, motorcycle.Make, motorcycle.Model, motorcycle.Year, motorcycle.Nickname);
        }
    }
}
