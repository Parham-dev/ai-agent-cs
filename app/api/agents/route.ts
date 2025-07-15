import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { DatabaseError, ValidationError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const agents = await agentsService.getAgents(filters)
    
    return NextResponse.json({ agents })
  } catch (error) {
    console.error('GET /api/agents error:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const agent = await agentsService.createAgent(data)
    
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('POST /api/agents error:', error)
    
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
      { error: 'Internal Server Error', message: 'Failed to create agent' },
      { status: 500 }
    )
  }
}