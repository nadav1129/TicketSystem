using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SupportTicket.Api.Data;
using SupportTicket.Api.Seed;
using SupportTicket.Application.Chat.Interfaces;
using SupportTicket.Application.Chat.Services;
using SupportTicket.Infrastructure.Ai;
using SupportTicket.Infrastructure.Persistence.Queries;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? builder.Configuration["ConnectionStrings__DefaultConnection"];

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddScoped<IDbConnection>(_ => new NpgsqlConnection(connectionString));
builder.Services.AddScoped<ITicketChatApplicationService, TicketChatApplicationService>();
builder.Services.AddScoped<IChatIntentService, OpenAiChatIntentService>();
builder.Services.AddScoped<ILlmClient, OpenAiLlmClient>();
builder.Services.AddScoped<ITicketMetricsQueries, TicketMetricsQueries>();
builder.Services.AddScoped<ITicketListQueries, TicketListQueries>();
builder.Services.AddScoped<ChatAnswerFormatter>();

var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("Front", policy =>
    {
        policy
            .WithOrigins(frontendUrl)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.Configure<SeedOptions>(
    builder.Configuration.GetSection("Seed"));

builder.Services.AddHttpClient<DatabaseSeeder>();

var app = builder.Build();

await DatabaseSchemaBootstrapper.WaitForDatabaseAndApplyAsync(connectionString, app.Logger);

app.UseCors("Front");
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

app.Run();
