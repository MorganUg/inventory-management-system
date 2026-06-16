export const Card = ({
  title,
  icon: Icon,
  color = "text-amber-500",
  action,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon size={15} className={color} />
          <h2 className="font-semibold text-gray-700 text-sm">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};
