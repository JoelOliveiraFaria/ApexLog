using ApexLog.Application.DTOs;
using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;

namespace ApexLog.Application.Services;

public class MotorcycleService
{
    private readonly IMotorcycleRepository _motorcycleRepository;

    public MotorcycleService(IMotorcycleRepository motorcycleRepository)
    {
        _motorcycleRepository = motorcycleRepository;
    }

    public async Task<MotorcycleDto> CreateAsync(Guid userId, CreateMotorcycleDto dto)
    {
        var motorcycle = new Motorcycle(userId, dto.Make, dto.Model, dto.Year, dto.Nickname);
        await _motorcycleRepository.AddAsync(motorcycle);
        return ToDto(motorcycle);
    }

    public async Task<IReadOnlyList<MotorcycleDto>> GetAllAsync(Guid userId)
    {
        var motorcycles = await _motorcycleRepository.GetAllByUserIdAsync(userId);
        return motorcycles.Select(ToDto).ToList();
    }

    public async Task<MotorcycleDto?> GetByIdAsync(Guid userId, Guid id)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(id);
        return motorcycle == null || motorcycle.UserId != userId ? null : ToDto(motorcycle);
    }

    public async Task<MotorcycleDto> UpdateAsync(Guid userId, Guid id, UpdateMotorcycleDto dto)
    {
        var motorcycle = await GetOwnedMotorcycleAsync(userId, id);

        motorcycle.UpdateDetails(dto.Make, dto.Model, dto.Year, dto.Nickname);
        await _motorcycleRepository.SaveChangesAsync();
        return ToDto(motorcycle);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var motorcycle = await GetOwnedMotorcycleAsync(userId, id);

        if (await _motorcycleRepository.HasTripsAsync(id))
        {
            throw new InvalidOperationException("Não é possível apagar uma mota com viagens associadas.");
        }

        await _motorcycleRepository.DeleteAsync(motorcycle);
    }

    // Trata "existe mas pertence a outro utilizador" como 404 em vez de 403, para não revelar
    // a outros utilizadores autenticados que um determinado Id de mota sequer existe.
    private async Task<Motorcycle> GetOwnedMotorcycleAsync(Guid userId, Guid id)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Mota '{id}' não encontrada.");

        if (motorcycle.UserId != userId)
        {
            throw new KeyNotFoundException($"Mota '{id}' não encontrada.");
        }

        return motorcycle;
    }

    private static MotorcycleDto ToDto(Motorcycle motorcycle) =>
        new(motorcycle.Id, motorcycle.Make, motorcycle.Model, motorcycle.Year, motorcycle.Nickname);
}
