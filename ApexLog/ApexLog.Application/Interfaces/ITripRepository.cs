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
        Task<IReadOnlyList<Trip>> GetAllByUserIdAsync(Guid userId);
        Task<bool> ExistsAsync(Guid id);
        /// <summary>Devolve o Id do utilizador dono da viagem (via a mota), ou null se a viagem não existir.</summary>
        Task<Guid?> GetOwningUserIdAsync(Guid tripId);
        Task AddTelemetryBatchAsync(Guid tripId, IEnumerable<TelemetryPoint> points);
        Task FinishTripAsync(Guid tripId, DateTime endTime, double? distanceKm);
    }
}
