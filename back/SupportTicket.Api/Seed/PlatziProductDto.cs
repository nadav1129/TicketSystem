namespace SupportTicket.Api.Seed;

public sealed class PlatziProductDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public PlatziCategoryDto? Category { get; set; }
    public List<string>? Images { get; set; }
}

public sealed class PlatziCategoryDto
{
    public string Name { get; set; } = string.Empty;
}