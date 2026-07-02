using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Domain.Entities
{
    public class TelemetryPoint
    {
        public Guid Id { get; private set; }
        public DateTime Timestamp { get; private set; }
        public int Rpm {  get; private set; }
        public int SpeedKmh { get; private set; }
        public double ThrottlePosition { get; private set; }
        public double EngineTempC { get; private set; }

        public TelemetryPoint (DateTime timestamp, int rpm, int speedkmh, double throttleposition, double enginetempc)
        {
            Id = Guid.NewGuid ();
            Timestamp = timestamp;
            Rpm = rpm;
            SpeedKmh = speedkmh;
            ThrottlePosition = throttleposition;
            EngineTempC = enginetempc;
        }
    }
}
