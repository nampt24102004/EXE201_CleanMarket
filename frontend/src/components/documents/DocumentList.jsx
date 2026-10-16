import { Badge, Button } from 'react-bootstrap'
import { documentStatus } from '../../utils/documentStatus'

const formatDate = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : null)

// Supplier documents with their review result. Approved documents are the review record and cannot be withdrawn.
export default function DocumentList({ documents = [], onDelete, busyId }) {
  if (!documents.length) return null
  return (
    <div className="mt-3 d-grid gap-2">
      {documents.map((d) => {
        const [label, color] = documentStatus[d.status] || [d.status, 'light']
        const removable = onDelete && d.status !== 'APPROVED'
        return (
          <div key={d.id} className="d-flex justify-content-between align-items-start gap-2 border rounded-3 p-2">
            <div>
              <a href={d.fileUrl} target="_blank" rel="noreferrer">{d.documentName}</a>{' '}
              <Badge bg={color}>{label}</Badge>
              {d.expiryDate && <div className="small text-secondary">Hiệu lực đến {formatDate(d.expiryDate)}</div>}
              {d.status === 'REJECTED' && d.rejectionReason && <div className="small text-danger">Lý do: {d.rejectionReason}</div>}
              {d.status === 'EXPIRED' && <div className="small text-secondary">Vui lòng xóa và tải bản còn hiệu lực.</div>}
            </div>
            {removable && (
              <Button size="sm" variant="outline-danger" disabled={busyId === d.id} onClick={() => onDelete(d)}>
                {busyId === d.id ? 'Đang xóa...' : 'Xóa'}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
