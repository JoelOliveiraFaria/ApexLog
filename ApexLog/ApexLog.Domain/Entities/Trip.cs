using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Domain.Entities
{
    public class Trip
    {
        public Guid Id { get; private set; }
        public string MotoId { get; private set; }
        public DateTime StartTime { get; private set; }
        public DateTime EndTime { get; private set; }
        public double DistanceKm { get; private set; }

        private readonly List<TelemetryPoint> _telemetryPoints = new();
        public IReadOnlyCollection<TelemetryPoint> TelemetryPoints => _telemetryPoints.AsReadOnly();

        protected Trip() { }

        public Trip(string motoid, DateTime startTime) 
        { 
            Id = Guid.NewGuid();
            MotoId = string.IsNullOrWhiteSpace(motoid) ? throw new ArgumentException("Id is mandatory") : motoid;
            StartTime = startTime;
        }

        public void EndTrip(DateTime endTime, double distanceKm)
        {
            if (endTime < StartTime)
            {
                throw new ArgumentException("O tempo de fim não pode ser menor que o tempo de início.");
            }
            EndTime = endTime;
            DistanceKm = distanceKm;
        }

        public void AddTelemetryPoints(TelemetryPoint point)
        {
            if (point == null) throw new ArgumentNullException(nameof(point));
            _telemetryPoints.Add(point);
        }
    }
}
