import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { DatabaseError, NotFoundError } from '@/lib/utils/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await agentsService.toggleAgentStatus(id)
    
    return NextResponse.json({ agent })
  } catch (error) {
    console.error(`PATCH /api/agents/${(await params).id}/toggle error:`, error)
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      )
    }
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to toggle agent status' },
      { status: 500 }
    )
  }
}