"use server"

import { generateContract } from "../gemini"

interface ContractParams {
  prompt: string
  parties: Array<{ name: string; address: string }>
  country: string
  currency: string
  deadline: string
  termination: string
}

interface GeneratedContract {
  contract: string
  summary: string[]
  riskAnalysis: Array<{ level: string; description: string }>
}

export async function generateContractAction(params: ContractParams): Promise<GeneratedContract> {
  return await generateContract(params)
}
