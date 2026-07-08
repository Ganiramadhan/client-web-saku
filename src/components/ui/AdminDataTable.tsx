import { DataTable, type DataTableProps } from './DataTable'

export function AdminDataTable<T>(props: DataTableProps<T>) {
  return <DataTable {...props} variant="admin" />
}
