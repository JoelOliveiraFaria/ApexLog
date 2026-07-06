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

    public async Task<MotorcycleDto> CreateAsync(CreateMotorcycleDto dto)
    {
        var motorcycle = new Motorcycle(dto.Make, dto.Model, dto.Year, dto.Nickname);
        await _motorcycleRepository.AddAsync(motorcycle);
        return ToDto(motorcycle);
    }

    public async Task<IReadOnlyList<MotorcycleDto>> GetAllAsync()
    {
        var motorcycles = await _motorcycleRepository.GetAllAsync();
        return motorcycles.Select(ToDto).ToList();
    }

    public async Task<MotorcycleDto?> GetByIdAsync(Guid id)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(id);
        return motorcycle == null ? null : ToDto(motorcycle);
    }

    public async Task<MotorcycleDto> UpdateAsync(Guid id, UpdateMotorcycleDto dto)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Mota '{id}' não encontrada.");

        motorcycle.UpdateDetails(dto.Make, dto.Model, dto.Year, dto.Nickname);
        await _motorcycleRepository.SaveChangesAsync();
        return ToDto(motorcycle);
    }

    public async Task DeleteAsync(Guid id)
    {
        var motorcycle = await _motorcycleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Mota '{id}' não encontrada.");

        if (await _motorcycleRepository.HasTripsAsync(id))
        {
            throw new InvalidOperationException("Não é possível apagar uma mota com viagens associadas.");
        }

        await _motorcycleRepository.DeleteAsync(motorcycle);
    }

    private static MotorcycleDto ToDto(Motorcycle motorcycle) =>
        new(motorcycle.Id, motorcycle.Make, motorcycle.Model, motorcycle.Year, motorcycle.Nickname);
}
