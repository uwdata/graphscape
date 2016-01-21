module ApplicationHelper
    def flash_class(level)
    case level.intern
      when :notice then "info"
      when :success then "success"
      when :error then "danger"
      when :alert then "warning"
    end
  end

  def flash_icon(level)
    case level.intern
      when :success then "fa fa-thumbs-up"
      when :notice then "fa fa-info-circle"
      when :error then "fa fa-minus-circle"
      when :alert then "fa fa-exclamation-triangle"
    end

  end
end
