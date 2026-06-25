import { NextResponse } from 'next/server';

const KIE_UPLOAD_BASE = 'https://kieai.redpandaai.co';

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie');
    headers.delete('content-length');
    return headers;
}

async function proxy(request, { params }) {
    const slug = await params;
    const path = (slug.path || []).join('/');
    const { search } = new URL(request.url);
    const targetUrl = `${KIE_UPLOAD_BASE}/${path}${search}`;
    const method = request.method;
    const body = (method !== 'GET' && method !== 'HEAD') ? await request.arrayBuffer() : undefined;

    try {
        const response = await fetch(targetUrl, {
            method,
            headers: cleanHeaders(request),
            body,
            redirect: 'follow',
        });
        const contentType = response.headers.get('content-type') || 'application/json';
        const data = await response.arrayBuffer();
        return new Response(data, {
            status: response.status,
            headers: { 'content-type': contentType },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
