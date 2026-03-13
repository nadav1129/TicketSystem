namespace SupportTicket.Api.Seed;

public sealed class SeedOptions
{
    public bool Enabled { get; set; } = true;
    public bool ImportProducts { get; set; } = true;
    public bool CreateDemoTickets { get; set; } = true;
    public int ProductCount { get; set; } = 20;
    public int TicketCount { get; set; } = 20;
}