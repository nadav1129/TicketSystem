using Microsoft.AspNetCore.Mvc;
using SupportTicket.Application.Chat.Dtos;
using SupportTicket.Application.Chat.Interfaces;

namespace SupportTicket.Api.Controllers;

[ApiController]
[Route("api/chat")]
public sealed class ChatController : ControllerBase
{
    private readonly ITicketChatApplicationService _ticketChatApplicationService;

    public ChatController(ITicketChatApplicationService ticketChatApplicationService)
    {
        _ticketChatApplicationService = ticketChatApplicationService;
    }

    [HttpPost("ask")]
    public async Task<ActionResult<ChatAskResponse>> Ask(
        [FromBody] ChatAskRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _ticketChatApplicationService.AskAsync(
            request.Question,
            cancellationToken);

        if (!response.Success)
            return BadRequest(response);

        return Ok(response);
    }
}