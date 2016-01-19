class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :current_user
  before_action :new_user


  def new_user
    if !current_user
      if !cookies.permanent.signed[:user_id].blank?
        session[:user_id] = cookies.permanent.signed[:user_id]
      else
        cookies.permanent.signed[:user_id] = User.create().id
        session[:user_id] = cookies.permanent.signed[:user_id]
      end

      current_user
    end
  end


private
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

end
