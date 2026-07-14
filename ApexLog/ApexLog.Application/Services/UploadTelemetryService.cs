using ApexLog.Application.DTOs;
using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;

namespace ApexLog.Application.Services;

public class UploadTelemetryService
{
    private readonly ITripRepository _tripRepository;
    private readonly IMotorcycleRepository _motorcycleRepository;

    public UploadTelemetryService(ITripRepository tripRepository, IMotorcycleRepository motorcycleRepository)
    {
        _tripRepository = tripRepository;
        _motorcycleRepository = motorcycleRepository;
    }

    public async Task UploadAsync(Guid userId, UploadTripDto dto)
    {
        await EnsureOwnsMotorcycleAsync(userId, dto.MotorcycleId);

        // 1. Cria a entidade usando o construtor público de negócio
        var trip = new Trip(dto.MotorcycleId, dto.StartTime);

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
    public async Task<Guid> StartTripAsync(Guid userId, Guid motorcycleId, DateTime startTime)
    {
        await EnsureOwnsMotorcycleAsync(userId, motorcycleId);

        var trip = new Trip(motorcycleId, startTime);
        await _tripRepository.SaveAsync(trip);
        return trip.Id;
    }

    public async Task AppendTelemetryBatchAsync(Guid userId, Guid tripId, List<TelemetryPointDto> points)
    {
        await EnsureOwnsTripAsync(userId, tripId);

        var entities = points.Select(p => new TelemetryPoint(p.Timestamp, p.Rpm, p.SpeedKmh, p.ThrottlePosition, p.EngineTempC));
        await _tripRepository.AddTelemetryBatchAsync(tripId, entities);
    }

    public async Task FinishTripAsync(Guid userId, Guid tripId, DateTime endTime, double? distanceKm)
    {
        await EnsureOwnsTripAsync(userId, tripId);

        await _tripRepository.FinishTripAsync(tripId, endTime, distanceKm);
    }

    private async Task EnsureOwnsMotorcycleAsync(Guid userId, Guid motorcycleId)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(motorcycleId);
        if (motorcycle == null || motorcycle.UserId != userId)
        {
            throw new KeyNotFoundException($"Mota '{motorcycleId}' não encontrada.");
        }
    }

    // Trata "existe mas pertence a outro utilizador" como 404, mesmo padrão do MotorcycleService,
    // para não revelar a outros utilizadores autenticados que um determinado Id de viagem existe.
    private async Task EnsureOwnsTripAsync(Guid userId, Guid tripId)
    {
        var ownerUserId = await _tripRepository.GetOwningUserIdAsync(tripId);
        if (ownerUserId == null || ownerUserId != userId)
        {
            throw new KeyNotFoundException($"Viagem '{tripId}' não encontrada.");
        }
    }
}
