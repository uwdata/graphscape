class RulesController < ApplicationController
  def index
    @rules = current_user.rules;
  end
  def create
    @rule = Rule.new(rule_params)
    @rule.user = @current_user
    if @rule.save
      redirect_to edit_rule_path(@rule)
    else
      raise 'Failed to save the rule.'
    end
  end
  def edit
    @rule = Rule.find(params[:id])
  end
  def update
    @rule = Rule.find(params[:id])

    if @rule.update(rule_params)
      redirect_to making_rule_path(@rule)
    else
      raise 'Failed to update the rule.'
    end

  end
  def destroy

    @rule = Rule.find(params[:id])
    if @rule.destroy
      redirect_to making_rule_path()
    else
      raise 'Failed to destroy the rule.'
    end

    redirect_to making_rule_path()
  end

private
  def rule_params
    params.require(:rule).permit(:name, :script)
  end

end
