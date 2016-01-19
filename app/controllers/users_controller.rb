class UsersController < ApplicationController
  def update
    @user = User.find(params[:id])
    @user.update(user_params)
    render json: @user.to_json, status: 200
  end

  def user_params
    params.require(:user).permit(:name)
  end
end
