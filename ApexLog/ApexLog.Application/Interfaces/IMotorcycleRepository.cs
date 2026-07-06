using ApexLog.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ApexLog.Application.Interfaces
{
    public interface IMotorcycleRepository
    {
        Task AddAsync(Motorcycle motorcycle);
        Task<Motorcycle?> GetByIdAsync(Guid id);
        Task<IReadOnlyList<Motorcycle>> GetAllAsync();
        Task<bool> ExistsAsync(Guid id);
        Task<bool> HasTripsAsync(Guid id);
        Task SaveChangesAsync();
        Task DeleteAsync(Motorcycle motorcycle);
    }
}
