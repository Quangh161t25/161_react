import React from 'react';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { WikiTable, WikiTableColumn, WikiTableRow } from '../../types/note';

interface WikiTableEditorProps {
  tableData?: WikiTable;
  isEditable?: boolean;
  onChange?: (updatedTable: WikiTable) => void;
}

export const WikiTableEditor: React.FC<WikiTableEditorProps> = ({
  tableData,
  isEditable = false,
  onChange,
}) => {
  const defaultTable: WikiTable = {
    title: 'Bảng Dữ Liệu',
    columns: [
      { id: 'col-1', title: 'Cột 1', align: 'left', width: 180 },
      { id: 'col-2', title: 'Cột 2', align: 'left', width: 180 },
      { id: 'col-3', title: 'Cột 3', align: 'center', width: 140 },
    ],
    rows: [
      { id: 'row-1', cells: { 'col-1': 'Dữ liệu 1', 'col-2': 'Dữ liệu 2', 'col-3': '100' } },
      { id: 'row-2', cells: { 'col-1': 'Dữ liệu 3', 'col-2': 'Dữ liệu 4', 'col-3': '200' } },
    ],
  };

  const table = tableData || defaultTable;

  const handleTitleChange = (newTitle: string) => {
    if (!onChange) return;
    onChange({ ...table, title: newTitle });
  };

  const handleAddColumn = () => {
    if (!onChange) return;
    const newColId = `col-${Date.now()}`;
    const newColumns: WikiTableColumn[] = [
      ...table.columns,
      { id: newColId, title: `Cột ${table.columns.length + 1}`, align: 'left', width: 160 },
    ];
    const newRows: WikiTableRow[] = table.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [newColId]: '' },
    }));
    onChange({ ...table, columns: newColumns, rows: newRows });
  };

  const handleDeleteColumn = (colId: string) => {
    if (!onChange || table.columns.length <= 1) return;
    const newColumns = table.columns.filter((c) => c.id !== colId);
    const newRows = table.rows.map((r) => {
      const copyCells = { ...r.cells };
      delete copyCells[colId];
      return { ...r, cells: copyCells };
    });
    onChange({ ...table, columns: newColumns, rows: newRows });
  };

  const handleUpdateColumnHeader = (colId: string, newTitle: string) => {
    if (!onChange) return;
    const newColumns = table.columns.map((c) =>
      c.id === colId ? { ...c, title: newTitle } : c
    );
    onChange({ ...table, columns: newColumns });
  };

  const handleUpdateColumnAlign = (colId: string, align: 'left' | 'center' | 'right') => {
    if (!onChange) return;
    const newColumns = table.columns.map((c) =>
      c.id === colId ? { ...c, align } : c
    );
    onChange({ ...table, columns: newColumns });
  };

  const handleAddRow = () => {
    if (!onChange) return;
    const newRowId = `row-${Date.now()}`;
    const emptyCells: { [colId: string]: string } = {};
    table.columns.forEach((c) => {
      emptyCells[c.id] = '';
    });
    const newRows = [...table.rows, { id: newRowId, cells: emptyCells }];
    onChange({ ...table, rows: newRows });
  };

  const handleDeleteRow = (rowId: string) => {
    if (!onChange || table.rows.length <= 1) return;
    const newRows = table.rows.filter((r) => r.id !== rowId);
    onChange({ ...table, rows: newRows });
  };

  const handleCellChange = (rowId: string, colId: string, value: string) => {
    if (!onChange) return;
    const newRows = table.rows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          cells: { ...r.cells, [colId]: value },
        };
      }
      return r;
    });
    onChange({ ...table, rows: newRows });
  };

  return (
    <div className="w-full space-y-3">
      {/* Table Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <TableIcon className="w-4 h-4 text-primary shrink-0" />
          {isEditable ? (
            <input
              type="text"
              value={table.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Tiêu đề bảng số liệu (tùy chọn)..."
              className="font-semibold text-xs text-foreground bg-transparent border-b border-border/80 focus:border-primary focus:outline-none px-1 py-0.5 w-full max-w-sm"
            />
          ) : (
            <h5 className="font-bold text-xs text-foreground">
              {table.title || 'Bảng Số Liệu'}
            </h5>
          )}
        </div>

        {isEditable && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAddColumn}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Thêm cột
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Thêm hàng
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs custom-scrollbar">
        <table className="w-full text-xs text-left border-collapse">
          {/* Columns Header */}
          <thead className="bg-muted/80 text-foreground font-semibold border-b border-border">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-muted-foreground text-[10px] select-none border-r border-border/60">
                #
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  style={{ minWidth: col.width || 140 }}
                  className={`px-3 py-2 border-r border-border/60 last:border-r-0 ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {isEditable ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => handleUpdateColumnHeader(col.id, e.target.value)}
                        className="bg-transparent border-0 font-bold text-xs text-foreground focus:outline-none focus:bg-background/80 px-1 py-0.5 rounded w-full"
                      />
                      <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateColumnAlign(col.id, 'left')}
                          className={`p-0.5 rounded ${
                            col.align === 'left' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                          }`}
                          title="Canh trái"
                        >
                          <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateColumnAlign(col.id, 'center')}
                          className={`p-0.5 rounded ${
                            col.align === 'center' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                          }`}
                          title="Canh giữa"
                        >
                          <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateColumnAlign(col.id, 'right')}
                          className={`p-0.5 rounded ${
                            col.align === 'right' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                          }`}
                          title="Canh phải"
                        >
                          <AlignRight className="w-3 h-3" />
                        </button>
                        {table.columns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-0.5 rounded text-rose-500 hover:bg-rose-500/10"
                            title="Xóa cột này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span>{col.title}</span>
                  )}
                </th>
              ))}
              {isEditable && <th className="w-10 px-2 py-2 text-center text-muted-foreground text-[10px]">Thao tác</th>}
            </tr>
          </thead>

          {/* Rows Body */}
          <tbody className="divide-y divide-border/60 bg-card">
            {table.rows.map((row, rIdx) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-2 py-2 text-center text-muted-foreground text-[11px] font-mono border-r border-border/60 select-none">
                  {rIdx + 1}
                </td>
                {table.columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-3 py-2 border-r border-border/60 last:border-r-0 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {isEditable ? (
                      <input
                        type="text"
                        value={row.cells[col.id] || ''}
                        onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                        placeholder="..."
                        className={`w-full bg-transparent border-0 focus:outline-none focus:bg-background px-1 py-0.5 rounded text-xs text-foreground placeholder:text-muted-foreground/40 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      />
                    ) : (
                      <span className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {row.cells[col.id] || '—'}
                      </span>
                    )}
                  </td>
                ))}
                {isEditable && (
                  <td className="px-2 py-2 text-center">
                    {table.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Xóa hàng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
