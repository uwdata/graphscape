class RulesController < ApplicationController
  def index
    @rules = Rule.all;
    session[:return_to] = rules_path()
  end
  def create
    @rule = Rule.new(rule_params)
    @rule.user = @current_user

    if @rule.save
      flash[:success] = "Saved!"
      redirect_to edit_rule_path(@rule)
    else
      flash[:error] = 'Failed to save the rule.'
      redirect_to making_rule_path()
    end
  end

  def compare_with_human_answers
    @human_answers = HumanAnswer.all
    @rule = Rule.find(params[:id])
    @specs = Spec.all
  end


  def edit
    @rule = Rule.find(params[:id])

    if @rule.user != current_user
      flash[:error] = "You cannot edit others' rule."
      redirect_to session.delete(:return_to)
    end

  end
  def update
    @rule = Rule.find(params[:id])

    if @rule.user == current_user
      if @rule.update(rule_params)
        flash[:success] = "Saved!"
        redirect_to session.delete(:return_to)
      else
        flash[:error] = 'Failed to update the rule.'
        redirect_to session.delete(:return_to)
      end
    else
      flash[:error] = "You cannot edit others' rule."
      redirect_to session.delete(:return_to)
    end

  end
  def destroy

    @rule = Rule.find(params[:id])
    if @rule.user == current_user
      if @rule.destroy
        flash[:success] = "Destroyed!"
        redirect_to rules_path()
      else
        flash[:error] = "Failed to destroy the rule."
        redirect_to rules_path()
      end

    else
      flash[:error] = "You cannot destroy others' rule."
      redirect_to rules_path()
    end


  end

private
  def rule_params
    params.require(:rule).permit(:name, :script)
  end

end
