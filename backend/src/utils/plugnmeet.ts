import * as PlugNmeet from 'plugnmeet-sdk-js'
import dotenv from 'dotenv'
import path from 'path'

let plugNmeetClient: PlugNmeet.PlugNmeet | null = null

function getClient(): PlugNmeet.PlugNmeet {
    if (!plugNmeetClient) {
        const apiUrl = process.env.PLUGNMEET_API_URL
        const apiKey = process.env.PLUGNMEET_API_KEY
        const apiSecret = process.env.PLUGNMEET_SECRET_KEY
        if (!apiUrl || !apiKey || !apiSecret) {
            throw new Error('PlugNmeet API credentials not configured')
        }

        plugNmeetClient = new PlugNmeet.PlugNmeet(apiUrl, apiKey, apiSecret)
    }
    return plugNmeetClient
}

export const PlugNmeetService = async (params: PlugNmeet.JoinTokenParams) => {
    try {
        const client = await getClient()
        const response = await client.getJoinToken(params)
        console.log(response)
        if(response.status){
            return {
                status: true,
                token: response.token,
                url: `${process.env.PLUGNMEET_API_URL}/?access_token=${response.token}`
            }
        }
        return {
            status: false,
            message: response.msg
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to generate join token'
        }
    }
}