using System;
using System.Collections.Generic;

namespace ApexLog.Application.DTOs;

public record StartTripDto(string MotoId, DateTime StartTime);

public record StartTripResponseDto(Guid TripId);

public record TelemetryBatchDto(List<TelemetryPointDto> Points);

public record FinishTripDto(DateTime EndTime, double DistanceKm);
