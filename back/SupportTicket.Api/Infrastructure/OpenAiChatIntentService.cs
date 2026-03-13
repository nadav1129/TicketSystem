using System.Text.Json;
using SupportTicket.Application.Chat.Dtos;
using SupportTicket.Application.Chat.Interfaces;
using SupportTicket.Application.Chat.Prompts;

namespace SupportTicket.Infrastructure.Ai;

public interface ILlmClient
{
    Task<string> AskForJsonAsync(string prompt, CancellationToken cancellationToken);
}

public sealed class OpenAiChatIntentService : IChatIntentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly ILlmClient _llmClient;

    public OpenAiChatIntentService(ILlmClient llmClient)
    {
        _llmClient = llmClient;
    }

    public async Task<TicketChatIntent> ExtractIntentAsync(
        string question,
        CancellationToken cancellationToken)
    {
        var prompt = TicketChatPromptBuilder.BuildIntentPrompt(question);
        var json = await _llmClient.AskForJsonAsync(prompt, cancellationToken);

        var intent = JsonSerializer.Deserialize<TicketChatIntent>(json, JsonOptions);
        if (intent is null || string.IsNullOrWhiteSpace(intent.IntentName))
            throw new InvalidOperationException("The model did not return a valid ticket chat intent.");

        return intent;
    }
}