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
        public DbSet<Motorcycle> Motorcycles => Set<Motorcycle>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Motorcycle>(entity =>
            {
                entity.ToTable("motorcycles");
                entity.HasKey(m => m.Id);
                entity.Property(m => m.Make).IsRequired().HasMaxLength(50);
                entity.Property(m => m.Model).IsRequired().HasMaxLength(50);
                entity.Property(m => m.Year).IsRequired();
                entity.Property(m => m.Nickname).HasMaxLength(50);
            });

            modelBuilder.Entity<Trip>(entity =>
            {
                entity.ToTable("trips");
                entity.HasKey(t => t.Id);
                entity.Property(t => t.MotorcycleId).IsRequired();
                entity.Property(t => t.StartTime).IsRequired();
                entity.Property(t => t.EndTime);
                entity.Property(t => t.DistanceKm).IsRequired();

                // Restrict: uma mota com histórico de viagens não pode ser apagada por engano.
                entity.HasOne(t => t.Motorcycle)
                  .WithMany()
                  .HasForeignKey(t => t.MotorcycleId)
                  .OnDelete(DeleteBehavior.Restrict);

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
