using ApexLog.Application.Interfaces;
using ApexLog.Application.Services;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ApexLog.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURA��O DA INFRAESTRUTURA E DOM�NIO ---
// 1. Configurar o DbContext com PostgreSQL (L� o appsettings/secrets)
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApexLogDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Registar os componentes da Clean Architecture (Inje��o de Depend�ncia)
builder.Services.AddScoped<ITripRepository, TripRepository>();
builder.Services.AddScoped<IMotorcycleRepository, MotorcycleRepository>();
builder.Services.AddScoped<UploadTelemetryService>();
builder.Services.AddScoped<TripQueryService>();
builder.Services.AddScoped<MotorcycleService>();
// ------------------------------------------------

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();