class UsersController < ApplicationController
  def update
    @user = User.find_by_name(params[:user][:name])
    if ( @user)
      cookies.permanent.signed[:user_id] = @user.id
      session[:user_id] = cookies.permanent.signed[:user_id]
    else
      @user = User.find(params[:id])
      @user.update(user_params)
    end
    render json: @user.to_json, status: 200
  end

  def user_params
    params.require(:user).permit(:name)
  end
end
