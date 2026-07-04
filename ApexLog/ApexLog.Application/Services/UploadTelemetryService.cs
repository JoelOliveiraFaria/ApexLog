using ApexLog.Application.DTOs;
using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;

namespace ApexLog.Application.Services;

public class UploadTelemetryService
{
    private readonly ITripRepository _tripRepository;

    public UploadTelemetryService(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task UploadAsync(UploadTripDto dto)
    {
        // 1. Cria a entidade usando o construtor público de negócio
        var trip = new Trip(dto.MotoId, dto.StartTime);

        // 2. Passa os pontos do DTO para o comportamento do Domínio
        foreach (var p in dto.TelemetryPoints)
        {
            var point = new TelemetryPoint(p.Timestamp, p.Rpm, p.SpeedKmh, p.ThrottlePosition, p.EngineTempC);
            trip.AddTelemetryPoints(point);
        }

        // 3. Finaliza a viagem com os dados de fecho
        trip.EndTrip(dto.EndTime, dto.DistanceKm);

        // 4. Grava tudo no Postgres via Infraestrutura
        await _tripRepository.SaveAsync(trip);
    }

    /// <summary>
    /// Cria uma viagem em aberto (sem EndTime) para permitir o streaming de telemetria
    /// em tempo real a partir do mobile, ponto por ponto/lote em vez de tudo de uma vez.
    /// </summary>
    public async Task<Guid> StartTripAsync(string motoId, DateTime startTime)
    {
        var trip = new Trip(motoId, startTime);
        await _tripRepository.SaveAsync(trip);
        return trip.Id;
    }

    public async Task AppendTelemetryBatchAsync(Guid tripId, List<TelemetryPointDto> points)
    {
        var entities = points.Select(p => new TelemetryPoint(p.Timestamp, p.Rpm, p.SpeedKmh, p.ThrottlePosition, p.EngineTempC));
        await _tripRepository.AddTelemetryBatchAsync(tripId, entities);
    }

    public async Task FinishTripAsync(Guid tripId, DateTime endTime, double? distanceKm)
    {
        await _tripRepository.FinishTripAsync(tripId, endTime, distanceKm);
    }
}