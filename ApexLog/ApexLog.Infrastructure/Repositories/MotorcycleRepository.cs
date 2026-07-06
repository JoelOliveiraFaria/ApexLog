using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ApexLog.Infrastructure.Repositories
{
    public class MotorcycleRepository : IMotorcycleRepository
    {
        private readonly ApexLogDbContext _context;

        public MotorcycleRepository(ApexLogDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Motorcycle motorcycle)
        {
            await _context.Motorcycles.AddAsync(motorcycle);
            await _context.SaveChangesAsync();
        }

        public async Task<Motorcycle?> GetByIdAsync(Guid id)
        {
            return await _context.Motorcycles.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IReadOnlyList<Motorcycle>> GetAllAsync()
        {
            return await _context.Motorcycles
                .OrderBy(m => m.Nickname)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Motorcycles.AnyAsync(m => m.Id == id);
        }

        public async Task<bool> HasTripsAsync(Guid id)
        {
            return await _context.Trips.AnyAsync(t => t.MotorcycleId == id);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Motorcycle motorcycle)
        {
            _context.Motorcycles.Remove(motorcycle);
            await _context.SaveChangesAsync();
        }
    }
}
