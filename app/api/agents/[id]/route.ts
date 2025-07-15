import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const agent = await agentsService.getAgentById(id)

    if (!agent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    const { id } = await params
    console.error(`GET /api/agents/${id} error:`, error)
    
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
      { error: 'Internal Server Error', message: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const agent = await agentsService.updateAgent(id, data)
    
    return NextResponse.json({ agent })
  } catch (error) {
    const { id } = await params
    console.error(`PATCH /api/agents/${id} error:`, error)
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      )
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message, field: error.field },
        { status: 400 }
      )
    }
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Agent ID is required' },
        { status: 400 }
      )
    }

    await agentsService.deleteAgent(id)
    
    return NextResponse.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    const { id } = await params
    console.error(`DELETE /api/agents/${id} error:`, error)
    
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
      { error: 'Internal Server Error', message: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
