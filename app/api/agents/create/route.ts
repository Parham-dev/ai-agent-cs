import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { DatabaseError, ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Additional validation for required fields
    if (!data.organizationId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Organization ID is required', field: 'organizationId' },
        { status: 400 }
      )
    }

    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Agent name is required', field: 'name' },
        { status: 400 }
      )
    }

    if (!data.instructions?.trim()) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Agent instructions are required', field: 'instructions' },
        { status: 400 }
      )
    }

    const agent = await agentsService.createAgent({
      organizationId: data.organizationId,
      name: data.name.trim(),
      instructions: data.instructions.trim(),
      tools: data.tools || [],
      model: data.model || 'gpt-4o',
      isActive: data.isActive ?? true
    })
    
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('POST /api/agents/create error:', error)
    
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
