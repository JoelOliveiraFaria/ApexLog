using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApexLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMotorcycles : Migration
    {
        // Mota "padrão" para a qual as viagens antigas (só com o campo de texto livre MotoId)
        // são migradas automaticamente. Reatribui-las a motas reais depois com um UPDATE simples
        // em "trips" — este Id fixo é só o placeholder que torna a migração segura de aplicar.
        private static readonly Guid DefaultMotorcycleId = new("11111111-1111-1111-1111-111111111111");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "motorcycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Make = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Nickname = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_motorcycles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "motorcycles",
                columns: new[] { "Id", "Make", "Model", "Year", "Nickname" },
                values: new object[] { DefaultMotorcycleId, "CFMOTO", "450SR", 2024, "CFMOTO-450SR" });

            // defaultValue backfila todas as viagens existentes para a mota "padrão" acima —
            // a FK abaixo só é válida porque a mota já existe na tabela nesta altura da migração.
            migrationBuilder.AddColumn<Guid>(
                name: "MotorcycleId",
                table: "trips",
                type: "uuid",
                nullable: false,
                defaultValue: DefaultMotorcycleId);

            migrationBuilder.DropColumn(
                name: "MotoId",
                table: "trips");

            migrationBuilder.CreateIndex(
                name: "IX_trips_MotorcycleId",
                table: "trips",
                column: "MotorcycleId");

            migrationBuilder.AddForeignKey(
                name: "FK_trips_motorcycles_MotorcycleId",
                table: "trips",
                column: "MotorcycleId",
                principalTable: "motorcycles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_trips_motorcycles_MotorcycleId",
                table: "trips");

            migrationBuilder.DropIndex(
                name: "IX_trips_MotorcycleId",
                table: "trips");

            migrationBuilder.AddColumn<string>(
                name: "MotoId",
                table: "trips",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.DropColumn(
                name: "MotorcycleId",
                table: "trips");

            migrationBuilder.DropTable(
                name: "motorcycles");
        }
    }
}
