using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApexLog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUsers : Migration
    {
        // Utilizador "seed" ao qual as motas já existentes (criadas antes de existir autenticação)
        // são atribuídas. A password hash é de uma password aleatória descartada — nunca foi
        // pensada para ser usada para login, é só o placeholder que torna a migração segura.
        private static readonly Guid SeedUserId = new("22222222-2222-2222-2222-222222222222");
        private const string SeedPasswordHash = "$2a$11$qmvcCGubMePl.xPdJ/9UxeXK7vcfN0YWZ9TSSfYaPpdXo7zWm3J8m";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "Id", "Name", "Email", "PasswordHash", "CreatedAt" },
                values: new object[] { SeedUserId, "Seed User", "seed@apexlog.local", SeedPasswordHash, DateTime.UtcNow });

            // defaultValue backfila as motas já existentes para o utilizador "seed" acima —
            // a FK abaixo só é válida porque o utilizador já existe na tabela nesta altura da migração.
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "motorcycles",
                type: "uuid",
                nullable: false,
                defaultValue: SeedUserId);

            migrationBuilder.CreateIndex(
                name: "IX_motorcycles_UserId",
                table: "motorcycles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_motorcycles_users_UserId",
                table: "motorcycles",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_motorcycles_users_UserId",
                table: "motorcycles");

            migrationBuilder.DropIndex(
                name: "IX_motorcycles_UserId",
                table: "motorcycles");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "motorcycles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
