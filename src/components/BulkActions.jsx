import React from "react";
import {
  MdDelete,
  MdMarkEmailRead,
  MdMarkEmailUnread,
} from "react-icons/md";
import useClickSound from "../hooks/useClickSound";

const BulkActions = ({
  selected,
  onSelectAll,
  onUpdateStatus,
  onDelete,
  isAllSelected,
}) => {
  const setupClickSound = useClickSound();
  const hasSelection = selected.length > 0;

  return (
    <div className="msg-bulk-actions">
      {/* Select All Checkbox */}
      <label className="msg-select-all-label" title="Select all on this page">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={onSelectAll}
          className="msg-checkbox"
        />
        <span className="msg-select-all-text">
          {hasSelection ? `${selected.length} Selected` : "Select All"}
        </span>
      </label>

      {/* Action Buttons */}
      <div className="msg-bulk-btn-group">
        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onUpdateStatus(selected, true)}
          disabled={!hasSelection}
          className="msg-bulk-btn"
          title="Mark selected as Read"
        >
          <MdMarkEmailRead className="msg-bulk-btn-icon" />
          <span className="msg-bulk-btn-text">Read</span>
        </button>

        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onUpdateStatus(selected, false)}
          disabled={!hasSelection}
          className="msg-bulk-btn"
          title="Mark selected as Unread"
        >
          <MdMarkEmailUnread className="msg-bulk-btn-icon" />
          <span className="msg-bulk-btn-text">Unread</span>
        </button>

        <button
          ref={setupClickSound}
          type="button"
          onClick={() => onDelete(selected)}
          disabled={!hasSelection}
          className="msg-bulk-btn danger"
          title="Delete selected messages"
        >
          <MdDelete className="msg-bulk-btn-icon" />
          <span className="msg-bulk-btn-text">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
