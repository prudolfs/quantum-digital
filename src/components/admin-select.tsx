import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AdminSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id?: string
  label: string
  value: string
  options: { value: string; label: string }[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
