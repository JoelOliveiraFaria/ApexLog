using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApexLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTripStatistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "AvgSpeedKmh",
                table: "trips",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "MaxRpm",
                table: "trips",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxSpeedKmh",
                table: "trips",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvgSpeedKmh",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "MaxRpm",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "MaxSpeedKmh",
                table: "trips");
        }
    }
}
