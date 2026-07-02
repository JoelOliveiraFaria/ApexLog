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
}