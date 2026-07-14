using ApexLog.Application.Interfaces;
using ApexLog.Application.Services;
using ApexLog.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ApexLog.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURA��O DA INFRAESTRUTURA E DOM�NIO ---
// 1. Configurar o DbContext com PostgreSQL (L� o appsettings/secrets)
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApexLogDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Registar os componentes da Clean Architecture (Inje��o de Depend�ncia)
builder.Services.AddScoped<ITripRepository, TripRepository>();
builder.Services.AddScoped<IMotorcycleRepository, MotorcycleRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<UploadTelemetryService>();
builder.Services.AddScoped<TripQueryService>();
builder.Services.AddScoped<MotorcycleService>();
builder.Services.AddScoped<AuthService>();
// ------------------------------------------------

// 3. Autenticação JWT
var jwtSigningKey = builder.Configuration["Jwt:SigningKey"]
    ?? throw new InvalidOperationException("Jwt:SigningKey não configurado (dotnet user-secrets set \"Jwt:SigningKey\" \"...\").");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Evita que o handler remapeie "sub" para o URI legado ClaimTypes.NameIdentifier —
        // sem isto, User.FindFirst(JwtRegisteredClaimNames.Sub) não encontraria o claim.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "ApexLog",
            ValidateAudience = true,
            ValidAudience = "ApexLog",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
            ValidateLifetime = true,
        };
    });

builder.Services.AddAuthorization();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();