import { Tabs, TabsList, TabsTrigger } from './ui'

export function ResearchLens({
  value,
  onChange,
}: {
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="research-lens">
      <Tabs value={value || 'all'} onValueChange={onChange}>
        <TabsList aria-label="Research focus">
          <TabsTrigger value="all">All covered research</TabsTrigger>
          <TabsTrigger value="methods">Advancing AI</TabsTrigger>
          <TabsTrigger value="applications">AI in science</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
