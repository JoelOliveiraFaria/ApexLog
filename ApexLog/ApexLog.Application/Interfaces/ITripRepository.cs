using ApexLog.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Application.Interfaces
{
    public interface ITripRepository
    {
        Task SaveAsync(Trip trip);
        Task<Trip?> GetByIdAsync(Guid id);
        Task<IReadOnlyList<Trip>> GetAllAsync();
        Task<bool> ExistsAsync(Guid id);
        Task AddTelemetryBatchAsync(Guid tripId, IEnumerable<TelemetryPoint> points);
        Task FinishTripAsync(Guid tripId, DateTime endTime, double distanceKm);
    }
}
