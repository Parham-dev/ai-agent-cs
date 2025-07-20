/**
 * API Manager - coordinates all domain-specific API clients
 * Provides unified interface while maintaining clean separation of concerns
 */

import { AgentApiClient } from '../services/agent-client';
import { IntegrationApiClient } from '../services/integration-client';
import { AgentIntegrationApiClient } from '../services/agent-integration-client';
import { ModelsApiClient } from '../services/models-client';
import { OrganizationApiClient } from '../services/organization-client';
import type { BaseApiClientOptions } from '../base/types';

export class ApiManager {
  public readonly agents: AgentApiClient;
  public readonly integrations: IntegrationApiClient;
  public readonly agentIntegrations: AgentIntegrationApiClient;
  public readonly models: ModelsApiClient;
  public readonly organization: OrganizationApiClient;

  constructor(options: BaseApiClientOptions = {}) {
    this.agents = new AgentApiClient(options);
    this.integrations = new IntegrationApiClient(options);
    this.agentIntegrations = new AgentIntegrationApiClient(options);
    this.models = new ModelsApiClient(options);
    this.organization = new OrganizationApiClient(options);
  }

  /**
   * Create a public (non-authenticated) API manager for widget/public endpoints
   */
  static public(): ApiManager {
    return new ApiManager({ requireAuth: false });
  }
}