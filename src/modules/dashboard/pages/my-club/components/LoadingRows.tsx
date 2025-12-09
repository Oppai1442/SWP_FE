interface LoadingRowsProps {
  rows: number;
  columns: number;
}

const LoadingRows = ({ rows, columns }: LoadingRowsProps) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={`loading-${rowIndex}`} className="animate-pulse">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <td key={`loading-${rowIndex}-${colIndex}`} className="py-4">
            <div className="h-4 w-full rounded-full bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default LoadingRows;
