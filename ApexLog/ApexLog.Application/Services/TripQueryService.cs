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

        public async Task<IReadOnlyList<TripSummaryDto>> GetAllTripsAsync()
        {
            var trips = await _tripRepository.GetAllAsync();

            return trips.Select(t => new TripSummaryDto
            {
                Id = t.Id,
                MotoId = t.MotoId,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                DistanceKm = t.DistanceKm,
                MaxSpeedKmh = t.MaxSpeedKmh,
                AvgSpeedKmh = t.AvgSpeedKmh,
                MaxRpm = t.MaxRpm
            }).ToList();
        }

        public async Task<TripDetailDto?> GetTripByIdAsync(Guid id)
        {
            var trip = await _tripRepository.GetByIdAsync(id);

            if (trip == null) return null;

            return new TripDetailDto
            {
                Id = trip.Id,
                MotoId = trip.MotoId,
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
    }
}
