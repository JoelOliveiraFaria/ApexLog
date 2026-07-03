using ApexLog.Application.Interfaces;
using ApexLog.Application.Services;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ApexLog.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURAÇÃO DA INFRAESTRUTURA E DOMÍNIO ---
// 1. Configurar o DbContext com PostgreSQL (Lê o appsettings/secrets)
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApexLogDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Registar os componentes da Clean Architecture (Injeção de Dependência)
builder.Services.AddScoped<ITripRepository, TripRepository>();
builder.Services.AddScoped<UploadTelemetryService>();
builder.Services.AddScoped<TripQueryService>();
// ------------------------------------------------

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();