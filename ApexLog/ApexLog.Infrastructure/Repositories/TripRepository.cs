using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore; 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Infrastructure.Repositories
{
    public class TripRepository : ITripRepository
    {
        private readonly ApexLogDbContext _context;

        public TripRepository(ApexLogDbContext context)
        {
            _context = context;
        }

        public async Task SaveAsync(Trip trip)
        {
            await _context.Trips.AddAsync(trip);
            await _context.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<Trip>> GetAllAsync()
        {
            return await _context.Trips
                .OrderByDescending(t => t.StartTime)
                .ToListAsync();
        }

        public async Task<Trip?> GetByIdAsync(Guid id)
        {
            return await _context.Trips
                .Include(t => t.TelemetryPoints)
                .FirstOrDefaultAsync(t => t.Id == id);
        }
    }
}
