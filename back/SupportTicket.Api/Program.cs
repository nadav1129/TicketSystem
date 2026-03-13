using Microsoft.EntityFrameworkCore;
using SupportTicket.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? builder.Configuration["ConnectionStrings__DefaultConnection"];

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Front", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

await DatabaseSchemaBootstrapper.WaitForDatabaseAndApplyAsync(connectionString, app.Logger);

app.UseCors("Front");
app.UseAuthorization();
app.MapControllers();

app.Run();
