import type { AtlasData } from '../data/types'
import { navigate } from '../lib/router'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

interface NotFoundPageProps {
  atlas: AtlasData
}

export function NotFoundPage({ atlas }: NotFoundPageProps) {
  return (
    <div className="page">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Atlas page not found</CardTitle>
            <CardDescription>The current artifact includes {atlas.topics.length} curated topic profiles.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/')}>Return to Atlas</Button>
        </CardContent>
      </Card>
    </div>
  )
}

