using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ApexLog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ApexLog.Infrastructure.Data
{
    public class ApexLogDbContext : DbContext
    {
        public ApexLogDbContext(DbContextOptions<ApexLogDbContext> options) : base(options) { }

        public DbSet<Trip> Trips => Set<Trip>();
        public DbSet<TelemetryPoint> TelemetryPoints => Set<TelemetryPoint>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Trip>(entity =>
            {
                entity.ToTable("trips");
                entity.HasKey(t => t.Id);
                entity.Property(t => t.MotoId).IsRequired().HasMaxLength(50);
                entity.Property(t => t.StartTime).IsRequired();
                entity.Property(t => t.EndTime);
                entity.Property(t => t.DistanceKm).IsRequired();

                entity.HasMany(t => t.TelemetryPoints)
                  .WithOne()
                  .HasForeignKey("TripId")
                  .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TelemetryPoint>(entity =>
            {
                entity.ToTable("telemetry_points");
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Timestamp).IsRequired();
                entity.Property(p => p.Rpm).IsRequired();
                entity.Property(p => p.SpeedKmh).IsRequired();
                entity.Property(p => p.ThrottlePosition).IsRequired();
                entity.Property(p => p.EngineTempC).IsRequired();
            });
        }
    }
}
