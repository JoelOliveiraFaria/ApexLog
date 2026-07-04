using System;
using System.Collections.Generic;

namespace ApexLog.Application.DTOs;

public record StartTripDto(string MotoId, DateTime StartTime);

public record StartTripResponseDto(Guid TripId);

public record TelemetryBatchDto(List<TelemetryPointDto> Points);

/// <summary>
/// DistanceKm é opcional: quando omitida, o backend calcula-a por integração da
/// velocidade OBD2 ao longo do tempo em vez de depender de introdução manual.
/// </summary>
public record FinishTripDto(DateTime EndTime, double? DistanceKm);
